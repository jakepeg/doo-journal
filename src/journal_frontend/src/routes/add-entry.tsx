import { createFileRoute } from '@tanstack/react-router';
import AddEntryPage from '../components/AddEntryPage';

export const Route = createFileRoute('/add-entry')({
  component: AddEntryPage,
});
