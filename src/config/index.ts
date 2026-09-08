import {config} from "dotenv"
config()
export const env = {
    ADMIN: {
        EMAIL: process.env.SUPERADMIN_EMAIL,
        PASSWORD: process.env.SUPERADMIN_PASSWORD
    }
}