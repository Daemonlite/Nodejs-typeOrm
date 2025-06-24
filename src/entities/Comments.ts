import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn, 
  UpdateDateColumn
} from "typeorm";

import { Post } from "./Posts";
import { User } from "./User";

@Entity()
export class Comment{
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    content: string

    @ManyToOne(()=>User,(user)=>user.comments,{eager:false,onDelete:"CASCADE"})
    author:User

    @ManyToOne(()=>Post,(post)=>post.comments,{eager:false,onDelete:"CASCADE"})
    post:Post

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt: Date;


}