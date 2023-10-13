import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";


// export interface PostOptions {
//   backgroundColor?: string;
// }

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  prompt: string;
  inURL: string;
  outURL: string
}

export default class PostConcept {
  public readonly posts = new DocCollection<PostDoc>("posts");

  async create(author: ObjectId, prompt: string, inURL: string) {
    if (prompt!==undefined){ //if there is a prompt
      const imageurl = await this.getImage(prompt, inURL)
      const outURL = imageurl.output_url;
      
      const _id = await this.posts.createOne({ author, prompt, inURL, outURL });
      return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
    }

    else{ //if no prompt
      const outURL = ''
      const _id = await this.posts.createOne({ author, prompt, inURL, outURL });
      return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
    }
  }

  async getImage(prompt: string, imageurl: string){ //api call to AI-Image Generator
    const deepai = require('deepai'); 

    deepai.setApiKey('309d1703-7dff-44c7-847e-408ad698d5da');
    try {
      var resp = await deepai.callStandardApi("image-editor", {
        image: imageurl,
        text: prompt,
      });
      return resp;
    } catch (error) {
      return resp;
    }
  }
  
  async getPosts(query: Filter<PostDoc>) { 
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getPosts({ author });
  }

  async update(_id: ObjectId, update: Partial<PostDoc>) {
    this.sanitizeUpdate(update);
    await this.updateURL(update)
    await this.posts.updateOne({ _id }, update);
    
    return { msg: "Post successfully updated!" };
  }


  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }

  private async updateURL(update: Partial<PostDoc>){
    // updates the outURL from changed prompt or inURL
    if (update.prompt && update.inURL){
      const call = await this.getImage(update.prompt, update.inURL)
      const outURL = call.output_url
      console.log(outURL)
      update.outURL = outURL
    }
  }
    

  private sanitizeUpdate(update: Partial<PostDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["prompt", "inURL", "outURL"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
