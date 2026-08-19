import { SubmissionsList } from '@/components/submissions-list';
export default function Submissions() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Moderação</span>
        <h1>Produtos.</h1>
      </header>
      <SubmissionsList />
    </div>
  );
}
