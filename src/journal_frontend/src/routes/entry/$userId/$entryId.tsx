import { createFileRoute } from '@tanstack/react-router';
import EntryDetailPage from '../../../components/EntryDetailsPage';

export const Route = createFileRoute('/entry/$userId/$entryId')({
  component: EntryDetailPageRoute,
});

function EntryDetailPageRoute() {
  const { userId, entryId } = Route.useParams();
  return <EntryDetailPage userId={userId} entryId={entryId} />;
}
