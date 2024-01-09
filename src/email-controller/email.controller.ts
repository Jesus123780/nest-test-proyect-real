import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailData } from './class'

@Controller('email')
export class EmailController {
    /**
      * Processes a JSON and returns the EmailData structure.
      * @param {any} email The JSON to process.
      * @returns {EmailData} The processed EmailData structure.
      * @throws {BadRequestException} If the JSON is not in the expected format.
      */
    @Post('process')
    processEmail(@Body() email: any): EmailData {
        // Validate if the JSON has the expected structure
        if (!this.isValidEmailJson(email)) {
            throw new BadRequestException('El formato del JSON es inválido.');
        }

        // Perform JSON mapping and processing
        const records = email.Records[0];
        const emailData = new EmailData();
        emailData.spam = this.isPassStatus(records.ses.receipt.spamVerdict.status);
        emailData.virus = this.isPassStatus(records.ses.receipt.virusVerdict.status);
        emailData.dns =
            this.isPassStatus(records.ses.receipt.spfVerdict.status) &&
            this.isPassStatus(records.ses.receipt.dkimVerdict.status) &&
            this.isPassStatus(records.ses.receipt.dmarcVerdict.status);
        emailData.mes = this.getMonthFromTimestamp(records.ses.mail.timestamp);
        emailData.retrasado = this.isDelayed(records.ses.receipt.processingTimeMillis);
        emailData.emisor = this.extractUsernameFromEmail(records.ses.mail.source);
        emailData.receptor = this.extractUsernamesFromEmails(records.ses.mail.destination);

        return emailData;
    }

    /**
          * Checks if the JSON has the expected structure.
          * @param {any} email The JSON to verify.
          * @returns {boolean} true if the JSON has the expected structure, false otherwise.
          */
    private isValidEmailJson(email: any): boolean {
        return (
            email &&
            email.Records &&
            Array.isArray(email.Records) &&
            email.Records.length > 0 &&
            email.Records[0].ses &&
            email.Records[0].ses.receipt &&
            email.Records[0].ses.receipt.spamVerdict &&
            email.Records[0].ses.receipt.virusVerdict &&
            email.Records[0].ses.receipt.spfVerdict &&
            email.Records[0].ses.receipt.dkimVerdict &&
            email.Records[0].ses.receipt.dmarcVerdict &&
            email.Records[0].ses.receipt.processingTimeMillis &&
            email.Records[0].ses.mail &&
            email.Records[0].ses.mail.timestamp &&
            email.Records[0].ses.mail.source &&
            email.Records[0].ses.mail.destination
        );
    }

    /**
          * Check if the status is "PASS".
          * @param {string} status The status to check.
          * @returns {boolean} true if the status is "PASS", false otherwise.
          */
    private isPassStatus(status: string): boolean {
        return status === 'PASS';
    }

    /**
      * Gets the month from a timestamp.
      * @param {string} timestamp The timestamp.
      * @returns {string} The name of the month.
      */
    private getMonthFromTimestamp(timestamp: string): string {
        return new Date(timestamp).toLocaleString('default', { month: 'long' });
    }
    /**
          * Check if the processing time is greater than 1000.
          * @param {number} processingTimeMillis The processing time in milliseconds.
          * @returns {boolean} true if the processing time is greater than 1000, false otherwise.
          */
    private isDelayed(processingTimeMillis: number): boolean {
        return processingTimeMillis > 1000;
    }

    /**
          * Extract username from an email.
          * @param {string} email The email.
          * @returns {string} The username.
          */
    private extractUsernameFromEmail(email: string): string {
        return email.split('@')[0];
    }

/**
     * Extract usernames from an email list.
     * @param {string[]} emails The list of emails.
     * @returns {string[]} The usernames.
     */  private extractUsernamesFromEmails(emails: string[]): string[] {
        return emails.map((email: string) => email.split('@')[0]);
    }
}
