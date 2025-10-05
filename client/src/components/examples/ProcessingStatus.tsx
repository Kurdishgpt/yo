import { ProcessingStatus } from '../ProcessingStatus';

export default function ProcessingStatusExample() {
  const steps = [
    { id: '1', label: 'Extracting Audio', status: 'completed' as const },
    { id: '2', label: 'Transcribing', status: 'processing' as const },
    { id: '3', label: 'Translating to Kurdish', status: 'pending' as const },
    { id: '4', label: 'Generating Dubbing', status: 'pending' as const },
  ];

  return (
    <div className="p-8">
      <ProcessingStatus steps={steps} currentProgress={45} />
    </div>
  );
}
