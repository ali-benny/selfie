import { io } from 'socket.io-client';
import { CHAT_URL } from '~/const.js'

const socket = io(CHAT_URL); // Assicurati che l'URL corrisponda al tuo server

export default socket;