import { Client, Account } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Or your self-hosted URL
    .setProject('6982e6c500106f42fbe9');            // From Appwrite Console

export const account = new Account(client);
export { client };