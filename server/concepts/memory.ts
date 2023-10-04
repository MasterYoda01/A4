import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface MemoryDoc extends BaseDoc {
    author: ObjectId;
    dateToOpen: Date; 
    content: string;
}

export default class MemoryConcept {
    public readonly memories = new DocCollection<MemoryDoc>("memories");
  
    async create(author: ObjectId, dateToOpen: Date, content: string) {
        
        const _id = await this.memories.createOne({ author, dateToOpen, content });
        return { msg: "Memory successfully created!", memory: await this.memories.readOne({ _id }) };
    }

    // async unlockMemories(query: Filter<MemoryDoc>) {
    //     const memories = await this.memories.readMany(query, {
    //       sort: { dateUpdated: -1 },
    //     });
    //     return memories;
    // }

    async unlockRandomMemory(query: Filter<MemoryDoc>, dateToOpen: Date) {
        query.dateCreated = { $lt: dateToOpen };
        const memories = await this.memories.readMany(query, {
            sort: { dateUpdated: -1 },
        });
        
        //check if there are any posts
        if (memories.length === 0) {
            return null; // return null if no posts match the criteria
        }
        // genrate a random index within the range of the array length
        const randomIndex = Math.floor(Math.random() * memories.length);

        // Return the randomly selected post
        return memories[randomIndex];
    }
        

    async unlockMemories(query: Filter<MemoryDoc>, dateToOpen:Date) {
        query = {dateCreated: dateToOpen};
        
        const memories = await this.memories.readMany(query);
    
        if (memories.length === 0) {
            return null;
        }
        return memories; 
    }
    

    async getByAuthor(author: ObjectId, dateToOpen: Date) {
        return await this.unlockMemories( {author}, dateToOpen);
    }

    async update(_id: ObjectId, update: Partial<MemoryDoc>) { 
        this.sanitizeUpdate(update);
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

    private sanitizeUpdate(update: Partial<MemoryDoc>) {
    // Make sure the update cannot change the author.
        const allowedUpdates = ["content", "options"];
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
