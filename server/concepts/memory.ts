import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface MemoryDoc extends BaseDoc {
    author: ObjectId;
    dateToOpen: Date; 
    content?: string;
    url?: string;
}

export default class MemoryConcept {
    public readonly memories = new DocCollection<MemoryDoc>("memories");
  
    async create(author: ObjectId, dateToOpen: Date, content?: string, url?: string) {
        const _id = await this.memories.createOne({ author, dateToOpen, content, url });
        return { msg: "Memory successfully created!", memory: await this.memories.readOne({ _id }) };
    }

    async unlockAllReadyMemories(user: ObjectId) {
        const currentDate = new Date();
        const query: Filter<MemoryDoc> = {author: user, dateToOpen: { $lte: currentDate}}
        const memories = await this.memories.readMany(query, {sort: { dateUpdated: -1 } });
        return memories;
    }
    
    async unlockRandomMemory(user: ObjectId, dateRequested: Date) {
        // console.log(dateRequested)
        const newDateRequested = new Date(dateRequested)
        const query: Filter<MemoryDoc> = {author: user, dateToOpen: { $lte: newDateRequested }}
        const randomMemory = await this.memories.readMany(query);
        const randomIndex = Math.floor(Math.random() * randomMemory.length);
        return randomMemory[randomIndex];
    }
        
    async update(_id: ObjectId, update: Partial<MemoryDoc>) { 
        this.sanitizeUpdate(update);
        this.makeDateToOpen(update);
        await this.memories.updateOne({ _id }, update);
        return { msg: "Memory successfully updated!" };
    }

    async delete(_id: ObjectId) {
        await this.memories.deleteOne({ _id });
        return { msg: "Memory deleted successfully!" };
    }
    
    async isAuthor(user: ObjectId, _id: ObjectId) {
        const memory = await this.memories.readOne({ _id });
        if (!memory) {
            throw new NotFoundError(`Memory ${_id} does not exist!`);
        }
        if (memory.author.toString() !== user.toString()) {
            throw new MemoryAuthorNotMatchError(user, _id);
        }
    }

    
    private makeDateToOpen(update: Partial<MemoryDoc>){
    //grabs string form of DateToOpen and changes it to Date
        const date = update.dateToOpen
        if (date !==undefined){
            update.dateToOpen = new Date(date)
        }
    }

    private sanitizeUpdate(update: Partial<MemoryDoc>) {
    // Make sure the update cannot change the author.
        const allowedUpdates = ["content", "dateToOpen", "url"];
        for (const key in update) {
            if (!allowedUpdates.includes(key)) {
                throw new NotAllowedError(`Cannot update '${key}' field!`);
            }
        }
    }
}
    
export class MemoryAuthorNotMatchError extends NotAllowedError {
    constructor(
        public readonly author: ObjectId,
        public readonly _id: ObjectId,
    ) {
        super("{0} is not the author of Memory {1}!", author, _id);
    }
}
