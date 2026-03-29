 import { diskStorage } from 'multer'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const leadId = req.params.leadId
      const uploadPath = `uploads/${leadId}`
      fs.mkdirSync(uploadPath, { recursive: true })

      cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`
      cb(null, uniqueName)
    },
  }),

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, PNG allowed'), false)
    }
  },
}