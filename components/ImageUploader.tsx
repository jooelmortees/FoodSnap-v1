import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';
import { CameraIcon, UploadIcon, PhotoIcon, TrashIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ImageUploaderProps {
  onImageUpload: (imageDataUrls: string[]) => void;
  isLoadingExternal?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoadingExternal }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileProcessingPromises: Promise<string | null>[] = [];

      Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          setError(prevError => (prevError ? prevError + "\n" : "") + `"${file.name}" es demasiado grande (máx 10MB).`);
          fileProcessingPromises.push(Promise.resolve(null));
          return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
          setError(prevError => (prevError ? prevError + "\n" : "") + `"${file.name}" tiene un formato no admitido.`);
          fileProcessingPromises.push(Promise.resolve(null));
          return;
        }

        const reader = new FileReader();
        const promise = new Promise<string | null>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            setError(prevError => (prevError ? prevError + "\n" : "") + `Error leyendo "${file.name}".`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
        fileProcessingPromises.push(promise);
      });

      Promise.all(fileProcessingPromises)
        .then(results => {
          const newValidPreviews = results.filter(result => result !== null) as string[];
          setPreviews(prev => [...prev, ...newValidPreviews]);
        })
        .catch(() => {
          setError("Ocurrió un error inesperado al procesar las imágenes.");
        });

      event.target.value = '';
    }
  };

  const handleRemovePreview = (indexToRemove: number) => {
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitImages = () => {
    if (previews.length > 0) {
      setIsProcessing(true);
      onImageUpload(previews);
    } else {
      setError("Por favor, selecciona o captura al menos una imagen.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90
      });
      if (photo?.dataUrl) {
        setPreviews(prev => [...prev, photo.dataUrl!]);
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara o el usuario canceló la acción.");
    }
  };

  useEffect(() => {
    if (!isLoadingExternal) {
      setIsProcessing(false);
    }
  }, [isLoadingExternal]);

  const effectiveIsLoading = isProcessing || isLoadingExternal;

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-10 bg-surface shadow-xl rounded-2xl text-center min-h-[calc(100vh-300px)]">
      <PhotoIcon className="w-20 h-20 md:w-28 md:h-28 text-primary mb-6" />
      <h1 className="text-3xl sm:text-4xl font-bold text-onSurface mb-3">
        Descubre Recetas con <span className="text-primary">FoodSnap</span>
      </h1>
      <p className="text-lg text-onSurface-light mb-8 md:mb-10 max-w-xl">
        ¿Nevera llena, cero ideas? Toma o sube una o varias fotos de tus ingredientes y deja que nuestra IA te inspire.
      </p>

      {error && (
        <div className="text-error mb-4 text-sm bg-error/10 p-3 rounded-md w-full max-w-xl whitespace-pre-line">
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="mb-6 w-full max-w-2xl">
          <h3 className="text-md font-medium text-onSurface-light mb-2">Imágenes seleccionadas:</h3>
          <div className="flex overflow-x-auto space-x-3 pb-3 items-center min-h-[100px] bg-gray-50 p-3 rounded-lg border border-gray-200">
            {previews.map((previewSrc, index) => (
              <div key={index} className="relative group flex-shrink-0">
                <img src={previewSrc} alt={`Previsualización ${index + 1}`} className="h-24 w-auto rounded-md shadow-sm border-2 border-gray-300 group-hover:border-primary-light" />
                <Button
                  variant="danger"
                  size="icon"
                  onClick={() => handleRemovePreview(index)}
                  className="absolute -top-2 -right-2 opacity-80 group-hover:opacity-100 !p-1 rounded-full z-10"
                  aria-label={`Eliminar previsualización ${index + 1}`}
                >
                  <TrashIcon className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-6">
        <Button
          onClick={handleTakePhoto}
          variant="secondary"
          size="large"
          className="w-full py-3"
          disabled={effectiveIsLoading}
          aria-label="Tomar foto con la cámara"
        >
          <CameraIcon className="w-5 h-5 mr-2" />
          Tomar Foto
        </Button>

        <Button 
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          size="large"
          className="w-full py-3"
          disabled={effectiveIsLoading}
          aria-label="Subir imágenes desde el dispositivo"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Subir Imágenes
        </Button>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <Button 
          onClick={handleSubmitImages} 
          size="large" 
          className="w-full max-w-lg py-3 text-base"
          disabled={effectiveIsLoading || previews.length === 0}
        >
          {effectiveIsLoading ? <LoadingSpinner color="text-white" /> : "Analizar Ingredientes"}
        </Button>
      )}

      {previews.length === 0 && !effectiveIsLoading && (
         <p className="text-sm text-gray-500 mt-8 max-w-md">
            Consejo: Sube una o varias imágenes claras donde los ingredientes estén bien iluminados.
         </p>
      )}
    </div>
  );
};
