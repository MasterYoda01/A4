
import CommentConcept from "./concepts/comment";
import FriendConcept from "./concepts/friend";
import MemoryConcept from "./concepts/memory";
import PostConcept from "./concepts/post";
import ReflectionConcept from "./concepts/reflection";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Comment = new CommentConcept();
export const Memory = new MemoryConcept();
export const Reflection = new ReflectionConcept();

