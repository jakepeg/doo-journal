import {
    type ReactNode,
    type PropsWithChildren,
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { AuthClient, type AuthClientCreateOptions, type AuthClientLoginOptions } from '@dfinity/auth-client';
import type { Identity } from '@dfinity/agent';
import { DelegationIdentity, isDelegationValid } from '@dfinity/identity';

export type Status = 'initializing' | 'idle' | 'logging-in' | 'success' | 'loginError';

export type InternetIdentityContext = {
    identity?: Identity;
    login: () => void;
    clear: () => void;
    loginStatus: Status;
    isInitializing: boolean;
    isLoginIdle: boolean;
    isLoggingIn: boolean;
    isLoginSuccess: boolean;
    isLoginError: boolean;
    loginError?: Error;
};

const THIRTY_DAYS_IN_NANOSECONDS = BigInt(30 * 24 * 3_600_000_000_000); // 30 days
const DEFAULT_IDENTITY_PROVIDER = import.meta.env.VITE_II_URL;

// 🔍 Debug: see what URL Vite is injecting from .env.local
console.log("Internet Identity Provider (from VITE_II_URL):", DEFAULT_IDENTITY_PROVIDER);

type ProviderValue = InternetIdentityContext;
const InternetIdentityReactContext = createContext<ProviderValue | undefined>(undefined);

async function createAuthClient(createOptions?: AuthClientCreateOptions): Promise<AuthClient> {
    const options: AuthClientCreateOptions = {
        idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
            ...createOptions?.idleOptions
        },
        ...createOptions
    };
    const authClient = await AuthClient.create(options);
    return authClient;
}

function assertProviderPresent(context: ProviderValue | undefined): asserts context is ProviderValue {
    if (!context) {
        throw new Error('InternetIdentityProvider is not present. Wrap your component tree with it.');
    }
}

export const useInternetIdentity = (): InternetIdentityContext => {
    const context = useContext(InternetIdentityReactContext);
    assertProviderPresent(context);
    return context;
};

export function InternetIdentityProvider({
    children,
    createOptions
}: PropsWithChildren<{
    children: ReactNode;
    createOptions?: AuthClientCreateOptions;
}>) {
    const [authClient, setAuthClient] = useState<AuthClient | undefined>(undefined);
    const [identity, setIdentity] = useState<Identity | undefined>(undefined);
    const [loginStatus, setStatus] = useState<Status>('initializing');
    const [loginError, setError] = useState<Error | undefined>(undefined);

    const setErrorMessage = useCallback((message: string) => {
        setStatus('loginError');
        setError(new Error(message));
    }, []);

    const handleLoginSuccess = useCallback(() => {
        const latestIdentity = authClient?.getIdentity();
        if (!latestIdentity) {
            setErrorMessage('Identity not found after successful login');
            return;
        }
        setIdentity(latestIdentity);
        setStatus('success');
    }, [authClient, setErrorMessage]);

    const handleLoginError = useCallback(
        (maybeError?: string) => {
            setErrorMessage(maybeError ?? 'Login failed');
        },
        [setErrorMessage]
    );

    const login = useCallback(() => {
        if (!authClient) {
            setErrorMessage(
                'AuthClient is not initialized yet, make sure to call `login` on user interaction e.g. click.'
            );
            return;
        }

        const currentIdentity = authClient.getIdentity();
        if (
            !currentIdentity.getPrincipal().isAnonymous() &&
            currentIdentity instanceof DelegationIdentity &&
            isDelegationValid(currentIdentity.getDelegation())
        ) {
            setErrorMessage('User is already authenticated');
            return;
        }

        const options: AuthClientLoginOptions = {
            identityProvider: DEFAULT_IDENTITY_PROVIDER,
            onSuccess: handleLoginSuccess,
            onError: handleLoginError,
            maxTimeToLive: THIRTY_DAYS_IN_NANOSECONDS
        };

        setStatus('logging-in');
        void authClient.login(options);
    }, [authClient, handleLoginError, handleLoginSuccess, setErrorMessage]);

    const clear = useCallback(() => {
        if (!authClient) {
            setErrorMessage('Auth client not initialized');
            return;
        }

        void authClient
            .logout()
            .then(() => {
                setIdentity(undefined);
                setStatus('idle');
                setError(undefined);
            })
            .catch((unknownError: unknown) => {
                setStatus('loginError');
                setError(unknownError instanceof Error ? unknownError : new Error('Logout failed'));
            });
    }, [authClient, setErrorMessage]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                setStatus('initializing');
                let existingClient = authClient;
                if (!existingClient) {
                    existingClient = await createAuthClient(createOptions);
                    if (cancelled) return;
                    setAuthClient(existingClient);
                }
                const isAuthenticated = await existingClient.isAuthenticated();
                if (cancelled) return;
                if (isAuthenticated) {
                    const loadedIdentity = existingClient.getIdentity();
                    
                    // Additional check for delegation validity on mainnet
                    if (loadedIdentity instanceof DelegationIdentity) {
                        const delegation = loadedIdentity.getDelegation();
                        if (!isDelegationValid(delegation)) {
                            console.log('[Auth] Delegation expired, clearing auth state');
                            await existingClient.logout();
                            setIdentity(undefined);
                            return;
                        }
                    }
                    
                    setIdentity(loadedIdentity);
                }
            } catch (unknownError) {
                setStatus('loginError');
                setError(unknownError instanceof Error ? unknownError : new Error('Initialization failed'));
            } finally {
                if (!cancelled) setStatus('idle');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [createOptions]);

    const value = useMemo<ProviderValue>(
        () => ({
            identity,
            login,
            clear,
            loginStatus,
            isInitializing: loginStatus === 'initializing',
            isLoginIdle: loginStatus === 'idle',
            isLoggingIn: loginStatus === 'logging-in',
            isLoginSuccess: loginStatus === 'success',
            isLoginError: loginStatus === 'loginError',
            loginError
        }),
        [identity, login, clear, loginStatus, loginError]
    );

    return createElement(InternetIdentityReactContext.Provider, { value, children });
}
