-- Miniatura opcional para fotos en R2 (key derivada del original, sufijo -thumb.jpg)
ALTER TABLE trabajo_media
  ADD COLUMN IF NOT EXISTS thumbnail_key text NULL;

COMMENT ON COLUMN trabajo_media.thumbnail_key IS 'R2 key de miniatura JPEG; null = legacy sin thumb';
