require("dotenv").config();
import { DUser } from "../models/user-model";
var nodemailer = require("nodemailer");
var jwt = require("jsonwebtoken");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

export namespace EmailService {
  export async function sendForgetPasswordEmail(user: DUser, subject: string) {
    const token = await jwt.sign(
      {
        _id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET
    );
    const url = `${process.env.APP_URL}/recover_password/${token}`;
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      
      const transport = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        port: 25,
        auth: {
          type: 'OAuth2',
          user: 'minolprageesha1@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      })
 
      const mailOptions = {
        from: 'MinolPrageesha 📨 <minolprageesha1@gmail.com>',
        to: `${user.email}`,
        subject: subject,
        html: `<tr>
                  <td style="padding:36px 30px 42px 30px;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
                      <tr>
                        <td style="padding:0 0 36px 0;color:#153643;">
                          <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Smile - Reset Password!</h1>
                          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
                            Did you request to change your password? If so click here.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0;">
                          <div style="width: 100%; background: #efefef; font-family: Lucida Grande,Lucida Sans Unicode,Lucida Sans,Geneva,Verdana,sans-serif; font-weight: bold; text-align: center; padding: 50px 0px;">                      
                            <a href="${url}" style="width: 50px; padding:10px; background: #fff; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; text-decoration: none;">
                              <span style="color: #3DBDA7; font-size:20px;"> Click Here</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
      }
      const result = await transport.sendMail(mailOptions)
      return result
    } catch (error) {
      return false;
    }
  }


  export async function sendSignupEmail(email: string, name: string, subject: string) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        port: 25,
        auth: {
          type: 'OAuth2',
          user: 'minolprageesha1@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      const mailOptions = {
        from: 'MinolPrageesha 📨 <minolprageesha1@gmail.com>',
        to: email,
        subject: subject,
        html: `<tr>
        <td style="padding:36px 30px 42px 30px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
            <tr>
              <td style="padding:0 0 36px 0;color:#153643;">
              <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Hello ${name ? name : "There"
          },</h1>
                <p style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Welcome To Life of Pease ! You have successfully created an account.</p>

              </td>
            </tr>
          </table>
        </td>
      </tr>`
      }

      const result = await transport.sendMail(mailOptions)
      return result
    } catch (error) {
      return false;
    }
  }

  export async function sendVerifyEmail(
    user: DUser,
    subject: string,
    verificationCode: string,
    bodyText1: string,
    bodyText2: string
  ) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        port: 25,
        auth: {
          type: 'OAuth2',
          user: 'minolprageesha1@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      const mailOptions = {
        from: 'MinolPrageesha 📨 <minolprageesha1@gmail.com>',
        to: user.email,
        subject: subject,
        html: `<tr>
        <td style="padding:36px 30px 42px 30px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
            <tr>
              <td style="padding:0 0 36px 0;color:#153643;">
                <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">${bodyText1}</h1>
                <p style="margin:0 0 0px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">${bodyText2}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <div style="width: 100%; background: #efefef; font-family: Lucida Grande,Lucida Sans Unicode,Lucida Sans,Geneva,Verdana,sans-serif; font-weight: bold; text-align: center; padding: 50px 0px;">
                  <span style="color: #153643; font-size:20px;">${verificationCode}</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      }
      const result = await transport.sendMail(mailOptions)
      return result
    } catch (error) {
      console.log(error);
      
      return false;
    }
  }


  export async function sendEventEmail(
    user: DUser,
    subject: string,
    bodyText1?: string,
    bodyText2?: string,
    otherUserName?: string
  ) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        port: 25,
        auth: {
          type: 'OAuth2',
          user: 'minolprageesha1@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      const mailOptions = {
        from: 'MinolPrageesha 📨 <minolprageesha1@gmail.com>',
        to: user.email,
        subject: subject,
        html: `<tr>
        <td style="padding:36px 30px 42px 30px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
          <tr>
            <td style="padding:0 0 36px 0;color:#153643;">
              <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">${bodyText1} ${otherUserName != null && otherUserName
      }</h1>
              <p style="margin:0 0 0px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">${bodyText2}</p>
            </td>
          </tr>
        </table>
      </td>
      </tr>`
      }
      const result = await transport.sendMail(mailOptions)
      return result
    } catch (error) {
      return false;
    }
  }


  export async function sendWelcomeEmail(
    user: DUser,
    subject: string,
  ) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        port: 25,
        auth: {
          type: 'OAuth2',
          user: 'minolprageesha1@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      const mailOptions = {
        from: 'MinolPrageesha 📨 <minolprageesha1@gmail.com>',
        to: user.email,
        subject: subject,
        html: `<tr>
        <td style="padding:36px 30px 42px 30px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
          <tr>
            <td style="padding:0 0 36px 0;color:#153643;">
              <p style="margin:0 0 0px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;"></p>
            </td>
          </tr>
        </table>
      </td>
      </tr>`
      }
      const result = await transport.sendMail(mailOptions)
      return result
    } catch (error) {
      return false;
    }
  }

  export async function sendAdminEmailWhenTherapistSignUp(
    user: DUser,
    subject: string,
    bodyText1?: string,
  ) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        port: 25,
        auth: {
          type: 'OAuth2',
          user: 'minolprageesha1@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      const mailOptions = {
        from: 'MinolPrageesha 📨 <minolprageesha1@gmail.com>',
        to: user.email,
        subject: subject,
        html: `<tr>
        <td style="padding:36px 30px 42px 30px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
          <tr>
            <td style="padding:0 0 36px 0;color:#153643;">
              <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">
      }</h1>
              <p style="margin:0 0 0px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">${bodyText1}</p>
            </td>
          </tr>
        </table>
      </td>
      </tr>`
      }
      const result = await transport.sendMail(mailOptions)
      return result
    } catch (error) {
      return false;
    }
  }

}

