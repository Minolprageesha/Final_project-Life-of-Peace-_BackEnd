import {  Request, Response } from "express";
import Chat from '../schemas/chat-schema'

export const chatController = async(req: Request, res: Response)=>{
    const {sender, receiver, message} = req.body
    try {

        console.log(sender, receiver, '========');
        

        const findChat = await Chat.findOne({ users: { $all: [sender.toString(), receiver.toString()]} })  
        console.log(findChat);
              

        if(findChat){
            await Chat.findByIdAndUpdate(findChat._id, { $push: { messages: { $each: [message] } } })
        }else{
            await Chat.create({users : [sender, receiver], messages : [ message ] })
        }

        res.status(200).send({msg : 'Success'})
        
    } catch (error) {   
        console.log(error);
             
        res.status(500).send({msg : 'Server error', error})

    }
}

export const getChatController = async(req: Request, res: Response)=>{
    const {sender, receiver} = req.params
    try {        

        const findChat = await Chat.findOne({ users: { $all: [sender, receiver]} })
        res.status(200).send({msg : 'Success', data : findChat})
        
    } catch (error) {
        res.status(500).send({msg : 'Server error'})

    }
}

