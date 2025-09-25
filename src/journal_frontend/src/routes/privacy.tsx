import { createFileRoute } from '@tanstack/react-router';
import PrivacyPolicyPage from '../components/PrivacyPolicyPage';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicyPage,
});
