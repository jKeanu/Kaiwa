import nodemailer from 'nodemailer'
import handlebars from 'handlebars'
import { dirname } from 'path';
import { fileURLToPath } from 'url'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config({ path: '../config.env' });


const __dirname = dirname(fileURLToPath(import.meta.url));

export class Email{
    constructor(user, url){
        this.to = user.email;
        this.displayName = user.displayName.split(' ')[0];
        this.url = url;
        this.from = `Kaiwa <${process.env.EMAIL_FROM}>`
    }
    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            // sendgrid
            return nodemailer.createTransport({
                host: 'in-v3.mailjet.com',
                port: 587,
                auth: {
                    user: process.env.MAILJET_API_KEY,
                    pass: process.env.MAILJET_API_SECRET
                }});
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }

    async send(subject){
        const source = fs.readFileSync(`${__dirname}/../templates/passwordReset.hbs`, 'utf8');
        const template = handlebars.compile(source);
        const html = template({ url: this.url, displayName: this.displayName, subject });
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
        }; 
        await this.newTransport().sendMail(mailOptions);
    }

    async sendPasswordReset(){
        await this.send(
            'Your password reset request for Kaiwa (expires in 10min)'
        )
    }
}