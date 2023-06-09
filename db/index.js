const { Client } = require('pg');

const { DATABASE_URL } = process.env;

const connectionString = DATABASE_URL || 'postgres://localhost:5432/juicebox_dev';

const client = new Client({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
});

async function createUser({ 
  username, 
  password,
  name,
  location
}) {
    try {
      const { rows: [ user ] } = await client.query(`
      INSERT INTO users(username, password, name, location) 
      VALUES($1, $2, $3, $4) 
      ON CONFLICT (username) DO NOTHING 
      RETURNING *;
    `, [username, password, name, location]);
      return user;
    } catch (error) {
      console.log(error)
    }
  }

  async function createPost({ 
  authorId,
  title, 
  content,
  tags = []
  }) {
    try {
      const { rows: [post] } = await client.query(`
        INSERT INTO posts ("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `, [authorId, title, content]
      );

      const tagList = await createTags(tags);
      
      return await addTagsToPost(post.id, tagList)
    } catch (error) {
      console.log(error)
    }
  }

  async function createTags(tagList) {

    if(tagList.length === 0){
      return
    }
    const insertValues = tagList.map((_, index) => `$${index + 1}`).join('), (');
    const selectValues = tagList.map((_, index) => `$${index + 1}`).join(', ');
    try {

      
      const { rows: tags } = await client.query(`
      INSERT INTO tags(name)
      VALUES (${insertValues})
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
      `, tagList)
      console.log('WWWWWWWWWW: ', tags);
      return tags
    } catch (error) {
      console.error(error)
    }
  }

  async function createPostTag(postId, tagId) {
    try {
      await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
      `, [postId, tagId]);
    } catch (error) {
      console.error(error);
    }
  }

  async function addTagsToPost(postId, tagList) {
    try {
      const createPostTagPromises = tagList.map(
        tag => createPostTag(postId, tag.id)
      );
  
      await Promise.all(createPostTagPromises);
  
      return await getPostById(postId);
    } catch (error) {
      console.error(error);
    }
  }

  async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);

      if (!post) {
        throw {
          name: "PostNotFoundError",
          message: "Could not find a post with that postId"
        };
      }
  
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      console.error(error);
    }
  }
  

async function updateUser(id, fields = {}) {
  const keys = Object.keys(fields);
  setString = keys.map((key, index) => `"${key}"=$${index + 1}`).join(', ');
  for (let key of keys) {
    if (
      ![
        'name',
        'location',
        'active',
        'username',
        'password'
      ].includes(key)
    )
      return;
  }

  try {
  const {rows: [user]} = await client.query(`
  UPDATE users
  SET ${setString}
  WHERE id = ${id}
  RETURNING *;
  `, Object.values(fields))
  return user
} 
catch (error) {
  console.log(error)
}
}

async function updatePost(postId, fields = {}) {
  const { tags } = fields;
  delete fields.tags;
  const keys = Object.keys(fields);
  setString = keys.map((key, index) => `"${key}"=$${index + 1}`).join(', ');
  console.log('TTTTTTTTTT: ', postId)
  try {
    if(setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postId }
        RETURNING *;
      `, Object.values(fields));
    }
    if (tags === undefined) {
      return await getPostById(postId);
    }
  const tagList = await createTags(tags);
  await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [id]);

  await addTagsToPost(postId, tagList);

  return await getPostById(postId);
} 
catch (error) {
  console.log(error)
}
}

async function getAllUsers() {
    const { rows } = await client.query(
      `SELECT id, username, name, location, active  
      FROM users;
    `);
  
    return rows;
  }

async function getAllTags() {
    const { rows } = await client.query(
      `SELECT *  
      FROM tags;
    `);
  
    return rows;
  }

  async function getAllPosts() {
    const { rows: postIds } = await client.query(
      `SELECT * 
      FROM posts;
      `);
    const posts = await Promise.all(postIds.map(post => getPostById(post.id)))
  
    return posts;
  }

  async function getPostsByTagName(tagName) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      const posts = await Promise.all(postIds.map(
        post => getPostById(post.id)
        ));
        return posts
    } catch (error) {
      throw error;
    }
  } 
  
  async function getUserByUsername(username) {
    try {
      const { rows: [user] } = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
      `, [username]);
  
      return user;
    } catch (error) {
      throw error;
    }
  }

  async function getPostsByUser(id) {
    try {
      const {rows} = await client.query(`
      SELECT * 
      FROM posts
      WHERE "authorId" = ${id};
      `);

      return rows
    } catch (error) {
      console.error(error)
    }
  }

  async function getUserById(id) {
    try {
      const {rows: [user]} = await client.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${ id }
      `)
      if(!user) 
      return null;
      delete user.password;
      const userPosts = await getPostsByUser(id);
      user.posts = userPosts;
      return user
    } catch (error) {
      console.error(error)
    }
  }
  

module.exports = {
    client,
    getAllUsers,
    createUser, 
    updateUser,
    updatePost,
    getPostsByUser,
    getAllPosts,
    createPost,
    getUserById,
    addTagsToPost,
    createTags, 
    getPostsByTagName,
    getAllTags,
    getUserByUsername,
    getPostById
  }
