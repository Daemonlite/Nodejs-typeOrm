import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,OneToMany } from "typeorm"
import { Post } from "./Posts"
export enum Status {
    ACTIVE = "active",
    INACTIVE = "inactive"
}

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number

    @Column()
    email: string

    @Column()
    phoneNumber: string

    @Column()
    password: string

    @Column({ default: false })
    isAdmin!: boolean;

    @Column({ default: false })
    isVerified!: boolean;

    @Column({ default: false })
    is2faEnabled!: boolean;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.ACTIVE
    })
    status: Status

    @OneToMany(() => Post, (post) => post.author)
    posts: Post[]

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

}

