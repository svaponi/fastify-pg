import Fastify, {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import * as path from "node:path";
import * as fs from "node:fs";
import * as client from 'prom-client';

const fastify: FastifyInstance = Fastify({logger: true});

dotenv.config();
const config = {
    host: process.env.PG_HOST || 'localhost',
    user: process.env.PG_USER || 'test',
    password: process.env.PG_PASSWORD || 'test',
    database: process.env.PG_DATABASE || 'test',
    port: parseInt(process.env.PG_PORT || '5435', 10),
}
console.log(config)
const pool = new Pool(config);

client.collectDefaultMetrics();

const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of requests'
});

fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.redirect('/health');
});

fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const result = await pool.query<{ one: number }>('SELECT 1 as one');
        return {status: result.rows[0].one === 1 ? 'up' : 'pigs might fly'};
    } catch (err) {
        fastify.log.error(err);
        return {status: 'down'};
    }
});

const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        requestCounter.inc();
        const startTime = Date.now();
        const size = parseInt((request.query as { size?: string }).size || '100', 10);
        const result = await pool.query<{
            id: string;
            name: string | null;
            email: string;
            created_at: string;
            updated_at: string;
        }>(
            'SELECT id, name, email, created_at, updated_at FROM users LIMIT $1',
            [size] // positional parameter
        );
        const data = result.rows
        const elapsed = Date.now() - startTime;
        return {elapsed, size, data};
    } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({error: 'Database query failed'});
    }
}

fastify.get('/users', getUsers);
fastify.get('/api/users', getUsers);

fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        reply.header('Content-Type', client.register.contentType);
        reply.send(await client.register.metrics());
    } catch (err) {
        reply.status(500).send({error: 'Failed to get metrics'});
    }
});

async function initSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    // Run multiple statements separated by semicolon
    const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

    for (const stmt of statements) {
        await pool.query(stmt);
    }

    console.log('Database schema initialized from schema.sql');
}

async function seedUsers() {
    const numOfUsers: number = parseInt(process.env.APP_SEED_SIZE || '10000', 10);
    const startTime = Date.now();

    const batchSize = 500; // insert in batches to avoid memory/transaction overload
    for (let i = 0; i < numOfUsers; i += batchSize) {
        const values: string[] = [];
        for (let j = 0; j < batchSize && i + j < numOfUsers; j++) {
            const email = `user+${i + j}@example.com`;
            values.push(`('${email}')`);
        }
        const query = `
            INSERT INTO users (email)
            VALUES ${values.join(',')} ON CONFLICT (email) DO NOTHING
        `;
        await pool.query(query);
    }

    const elapsed = Date.now() - startTime;
    console.log(`Create ${numOfUsers} users finished, elapsed ${elapsed} ms`)
}

const start = async () => {
    try {
        const port: number = parseInt(process.env.PORT || '5000', 10);
        await initSchema()
        await seedUsers()
        await fastify.listen({port});
        console.log(`Server running at http://localhost:${port}`);
        console.log(`- http://localhost:${port}/metrics`);
        console.log(`- http://localhost:${port}/users`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();