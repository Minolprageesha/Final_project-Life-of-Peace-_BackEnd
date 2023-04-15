import * as mongoose from "mongoose";
import {Schema} from "mongoose";


export const ChatSchema = new mongoose.Schema({
    users: {
        type: Schema.Types.Array,
        default : []
    },
    messages: {
        type: Schema.Types.Array,
        default : []
    }
});



const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;
