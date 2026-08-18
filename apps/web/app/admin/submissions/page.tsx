import { SubmissionsList } from '@/components/submissions-list';
export default function Submissions() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Fila de revisão</span>
        <h1>Submissões.</h1>
      </header>
      <SubmissionsList />
    </div>
  );
}
