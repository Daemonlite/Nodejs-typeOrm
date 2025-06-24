import { AppDataSource } from "../data-source";
import { Comment } from "../entities/Comments";
import { Post } from "../entities/Posts";
import { User } from "../entities/User";
import { NextFunction, Request, Response } from "express";
import { createResponse } from "../interfaces/otp.interface";

export class CommentsController {
  private commentRepository = AppDataSource.getRepository(Comment);
  private userRepository = AppDataSource.getRepository(User);
  private postRepository = AppDataSource.getRepository(Post);

  async createComment(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const { content, postId } = request.body;

    if (!content) {
      return response
        .status(400)
        .json(createResponse(false, "content is required"));
    } else if (!postId) {
      return response
        .status(400)
        .json(createResponse(false, "comment added successfully"));
    }

    const post = await this.postRepository.findOneBy({ id: postId });

    if (!post) {
      return response.status(404).json(createResponse(false, "post not found"));
    }

    const author = request.user;

    const comment = new Comment();
    comment.author = author;
    comment.content = content;
    comment.post = post;

    await this.commentRepository.save(comment);

    return response
      .status(201)
      .json(createResponse(true, "comment added successfully", comment));
  }

  async removeComment(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const id = parseInt(request.params.id);

    if (!id) {
      return response
        .status(400)
        .json(createResponse(false, "comment id not provided"));
    }

    const comment = await this.commentRepository.findOneBy({ id });

    if (!comment){
        return response.status(404).json(createResponse(false,"comment not found"))
    }

    await this.commentRepository.remove(comment)

    return response.status(200).json(createResponse(true,"comment removed successfully"))
  }
}
