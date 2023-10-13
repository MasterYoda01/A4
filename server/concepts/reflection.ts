import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";


export interface ReflectionDoc extends BaseDoc {
  author: ObjectId;
  content?: string;
  url?: string;
}

export default class ReflectionConcept {
  public readonly reflections = new DocCollection<ReflectionDoc>("reflections");

  async create(author: ObjectId, content?: string, url?: string) {
    const _id = await this.reflections.createOne({ author, content, url });
    return { msg: "Reflection successfully created!", reflection: await this.reflections.readOne({ _id }) };
  }

  async getReflections(query: Filter<ReflectionDoc>) { 
    const reflections = await this.reflections.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return reflections;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getReflections({ author });
  }

  async update(_id: ObjectId, update: Partial<ReflectionDoc>) {
    this.sanitizeUpdate(update);
    await this.reflections.updateOne({ _id }, update);
    return { msg: "Reflections successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.reflections.deleteOne({ _id });
    return { msg: "Reflection deleted successfully!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const reflection = await this.reflections.readOne({ _id });
    if (!reflection) {
      throw new NotFoundError(`Reflection ${_id} does not exist!`);
    }
    if (reflection.author.toString() !== user.toString()) {
      throw new ReflectionAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<ReflectionDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "url"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class ReflectionAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of reflection {1}!", author, _id);
  }
}
