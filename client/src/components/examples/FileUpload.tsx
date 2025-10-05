import { FileUpload } from '../FileUpload';

export default function FileUploadExample() {
  return (
    <div className="p-8">
      <FileUpload onFileSelect={(file) => console.log('File selected:', file.name)} />
    </div>
  );
}
