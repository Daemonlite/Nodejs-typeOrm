import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { User } from "./User";
import { Comment } from "./Comments";

@Entity()
export class Post {  

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    content: string;

    // Relationship - Many Posts belong to One User
    @ManyToOne(() => User, (user) => user.posts)
    author: User; 

    @OneToMany(()=>Comment,(comment)=>comment.post)
    comments:Comment[]

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @UpdateDateColumn( { type: "timestamp", default: () => "CURRENT_TIMESTAMP"} )
    updatedAt: Date;

     
}