import { existsSync, mkdirSync, constants, access } from 'fs';
import { resolve } from 'path';
import { diskStorage } from 'multer';

export const uploadDir = resolve(__dirname, '../../../uploads');


export const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    console.log('Upload dir absolute path:', uploadDir);
    if (!existsSync(uploadDir)) { 
      mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory at: ${uploadDir}`);
    }
    
    access(uploadDir, constants.W_OK, (err) => {
      if (err) {
        console.error(`No write permissions on ${uploadDir}`);
        return cb(new Error('No write permissions'), '');
      }
      cb(null, uploadDir);
    });
  },
  filename: (_req, file, cb) => {

    cb(null, file.originalname);
  },
});

export const multerOptions = {
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [

      'image/jpeg',
      'image/png',
      'image/gif',
      
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`), false);
    }
  },
};
