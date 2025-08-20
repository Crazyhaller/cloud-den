import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),

  // basic file&folder info
  name: text('name').notNull(),
  path: text('path').notNull(), // path in the storage system
  size: integer('size').notNull(),
  type: text('type').notNull(),

  // storage info
  fileUrl: text('file_url').notNull(), // URL to access the file
  thumbnailUrl: text('thumbnail_url'),

  // ownership info
  userId: text('user_id').notNull(),
  parentId: uuid('parent_id'), // parent folder ID will be null for root files

  // file/folder flags
  isFolder: boolean('is_folder').default(false).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  isTrash: boolean('is_trash').default(false).notNull(),

  // timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// relations

/*

parent : each file/folder can have a parent folder
children : each folder can have multiple files/folders inside it

*/
export const filesRelations = relations(files, ({ one, many }) => ({
  // relationship to parent folder
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),

  // relationship to children files/folders
  children: many(files),
}))

// Type definitions

export const File = typeof files.$inferSelect
export const NewFile = typeof files.$inferInsert
