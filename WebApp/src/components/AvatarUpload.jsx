import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import api from "../api/axios";
import styles from "./AvatarUpload.module.css";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, cropPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не вдалося підготувати зображення"));
          return;
        }

        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        resolve(file);
      },
      "image/jpeg",
      0.9
    );
  });
}

function AvatarUpload({
  currentAvatarUrl,
  userName,
  fullName,
  getAuthConfig,
  onUploaded,
  showToast,
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const previewLabel = useMemo(() => {
    return fullName || userName || "Користувач";
  }, [fullName, userName]);

  const handleSelectFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Дозволені лише JPG, PNG або WEBP", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Максимальний розмір файлу — 5 MB", "error");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setSelectedFileName(file.name);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = useCallback((_, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  const handleUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      showToast("Спочатку виберіть зображення", "error");
      return;
    }

    try {
      setIsUploading(true);

      const croppedFile = await getCroppedImg(selectedImage, croppedAreaPixels);

      const formData = new FormData();
      formData.append("file", croppedFile, selectedFileName || "avatar.jpg");

      const response = await api.post(
        "/api/profile/me/avatar",
        formData,
        {
          ...getAuthConfig(),
          headers: {
            ...getAuthConfig().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newAvatarUrl = response.data.avatarUrl;

      onUploaded(newAvatarUrl);

      showToast("Аватарку оновлено", "success");

      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }

      setSelectedImage(null);
      setSelectedFileName("");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося завантажити аватарку",
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setSelectedFileName("");
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.previewBlock}>
          <div className={styles.avatarPreview}>
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={previewLabel}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarFallback}>
                {(fullName?.charAt(0) || userName?.charAt(0) || "U").toUpperCase()}
              </span>
            )}
          </div>

          <div className={styles.previewMeta}>
            <strong>Поточна аватарка</strong>
            <span>JPG, PNG, WEBP до 5 MB</span>
          </div>
        </div>

        <div className={styles.editorBlock}>
          <label className={styles.fileButton}>
            Обрати файл
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleSelectFile}
              hidden
            />
          </label>
        </div>
      </div>

      {selectedImage && (
        <div className={styles.cropEditor}>
          <div className={styles.cropContainer}>
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className={styles.cropToolbar}>
            <div className={styles.sliderBlock}>
              <label htmlFor="zoomRange">Размер</label>
              <input
                id="zoomRange"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancel}
                disabled={isUploading}
              >
                Скасувати
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Завантажуємо..." : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarUpload;
