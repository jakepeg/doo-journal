import { useGetOwnHomepage } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function EncryptionDebugPanel() {
  const { data: homepage, isLoading, error } = useGetOwnHomepage();

  if (isLoading) return <div>Loading debug info...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;
  if (!homepage) return <div>No data</div>;

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-lg text-yellow-800">🔍 Encryption Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Entry Summary:</h4>
          <div className="flex gap-2">
            <Badge variant="outline">Total: {homepage.entries.length}</Badge>
            <Badge variant="default">Public: {homepage.entries.filter(e => e.isPublic).length}</Badge>
            <Badge variant="secondary">Private: {homepage.entries.filter(e => !e.isPublic).length}</Badge>
          </div>
        </div>

        {homepage.entries.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Entry Details:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {homepage.entries.map((entry, index) => (
                <div key={entry.id} className="p-3 bg-white rounded border text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-gray-900">{entry.title}</strong>
                    <Badge variant={entry.isPublic ? "default" : "secondary"} className="text-xs">
                      {entry.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div><strong>Content Preview:</strong> {entry.content.substring(0, 100)}...</div>
                    {!entry.isPublic && entry._originalContent && (
                      <>
                        <div><strong>Original Length:</strong> {entry._originalContent.length} bytes</div>
                        <div><strong>Decrypted Length:</strong> {entry.content.length} chars</div>
                        <div className="flex items-center gap-2">
                          <strong>Status:</strong>
                          {entry.content === '[Decryption failed]' ? (
                            <span className="text-red-600 font-semibold">❌ Decryption Failed</span>
                          ) : (
                            <span className="text-green-600 font-semibold">✅ Successfully Decrypted</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}