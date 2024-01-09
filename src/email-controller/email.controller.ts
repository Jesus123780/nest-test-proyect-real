import { 
    Controller, 
    Post, 
    Body
} from '@nestjs/common';
import * as fs from 'fs';
import * as axios from 'axios'
import { join } from 'path';
import { simpleParser } from 'mailparser'

@Controller('email')
export class EmailController {
    /**
      * Processes a JSON and returns the EmailData structure.
      * @param {any} email The JSON to process.
      * @returns {EmailData} The processed EmailData structure.
      * @throws {BadRequestException} If the JSON is not in the expected format.
      */
    @Post('process')
    async processEmail(@Body() urlOrPath: any): Promise<any> {
        const { path } = urlOrPath

        if (!path) return {}
        let jsonData: any;

        if (path.startsWith('http')) {
            // Si la URL es proporcionada, descarga el correo electrónico
            const response = await axios.default.get(path);
            const mail = response.data;

            return mail
        } else {
            // Si es una ruta local, lee el archivo
            const emlFileName = path;
            const projectRoot = join(__dirname, '..', '..');
            const uploadFolderPath = join(projectRoot, 'upload', emlFileName);

            const mail = fs.readFileSync(uploadFolderPath, 'utf8');

            jsonData = await this.extractJsonFromMail(mail);
        }

        return jsonData;
    }

    private async extractJsonFromMail(mail: string): Promise<any> {
        try {
            const parsed = await simpleParser(mail);
            // Accede a los elementos del correo parseado
            console.log('Asunto:', parsed.subject);
            console.log('Cuerpo:', parsed.text);
            console.log('Archivos adjuntos:', parsed.attachments);
            // Devuelve el objeto de correo parseado o los datos que necesites
            return parsed;
        } catch (error) {
            throw new Error('Error al analizar el correo electrónico.');
        }
    }
}
