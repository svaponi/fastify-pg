"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fastify_1 = require("fastify");
var pg_1 = require("pg");
var dotenv = require("dotenv");
var path = require("node:path");
var fs = require("node:fs");
var client = require("prom-client");
var fastify = (0, fastify_1.default)({ logger: true });
dotenv.config();
var config = {
    host: process.env.PG_HOST || 'localhost',
    user: process.env.PG_USER || 'test',
    password: process.env.PG_PASSWORD || 'test',
    database: process.env.PG_DATABASE || 'test',
    port: parseInt(process.env.PG_PORT || '5435', 10),
};
console.log(config);
var pool = new pg_1.Pool(config);
client.collectDefaultMetrics();
var requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of requests'
});
fastify.get('/', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query('SELECT NOW()')];
            case 1:
                result = _a.sent();
                return [2 /*return*/, { time: result.rows[0].now }];
            case 2:
                err_1 = _a.sent();
                fastify.log.error(err_1);
                reply.status(500).send({ error: 'Database query failed' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
fastify.get('/users', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var startTime, size, result, data, elapsed, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestCounter.inc();
                startTime = Date.now();
                size = parseInt(request.query.size || '100', 10);
                return [4 /*yield*/, pool.query('SELECT id, name, email, created_at, updated_at FROM users LIMIT $1', [size] // positional parameter
                    )];
            case 1:
                result = _a.sent();
                data = result.rows;
                elapsed = Date.now() - startTime;
                return [2 /*return*/, { elapsed: elapsed, size: size, data: data }];
            case 2:
                err_2 = _a.sent();
                fastify.log.error(err_2);
                reply.status(500).send({ error: 'Database query failed' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
fastify.get('/metrics', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, err_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                reply.header('Content-Type', client.register.contentType);
                _b = (_a = reply).send;
                return [4 /*yield*/, client.register.metrics()];
            case 1:
                _b.apply(_a, [_c.sent()]);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _c.sent();
                reply.status(500).send({ error: 'Failed to get metrics' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
function initSchema() {
    return __awaiter(this, void 0, void 0, function () {
        var schemaPath, schemaSQL, statements, _i, statements_1, stmt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    schemaPath = path.join(__dirname, 'schema.sql');
                    schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
                    statements = schemaSQL
                        .split(';')
                        .map(function (stmt) { return stmt.trim(); })
                        .filter(function (stmt) { return stmt.length > 0; });
                    _i = 0, statements_1 = statements;
                    _a.label = 1;
                case 1:
                    if (!(_i < statements_1.length)) return [3 /*break*/, 4];
                    stmt = statements_1[_i];
                    return [4 /*yield*/, pool.query(stmt)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('Database schema initialized from schema.sql');
                    return [2 /*return*/];
            }
        });
    });
}
function seedUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var numOfUsers, startTime, batchSize, i, values, j, email, query, elapsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    numOfUsers = parseInt(process.env.APP_SEED_SIZE || '10000', 10);
                    startTime = Date.now();
                    batchSize = 500;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < numOfUsers)) return [3 /*break*/, 4];
                    values = [];
                    for (j = 0; j < batchSize && i + j < numOfUsers; j++) {
                        email = "user+".concat(i + j, "@example.com");
                        values.push("('".concat(email, "')"));
                    }
                    query = "\n            INSERT INTO users (email)\n            VALUES ".concat(values.join(','), " ON CONFLICT (email) DO NOTHING\n        ");
                    return [4 /*yield*/, pool.query(query)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i += batchSize;
                    return [3 /*break*/, 1];
                case 4:
                    elapsed = Date.now() - startTime;
                    console.log("Create ".concat(numOfUsers, " users finished, elapsed ").concat(elapsed, " ms"));
                    return [2 /*return*/];
            }
        });
    });
}
var start = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, initSchema()];
            case 1:
                _a.sent();
                return [4 /*yield*/, seedUsers()];
            case 2:
                _a.sent();
                return [4 /*yield*/, fastify.listen({ port: 3000 })];
            case 3:
                _a.sent();
                console.log('Server running at http://localhost:3000');
                console.log('- http://localhost:3000/metrics');
                console.log('- http://localhost:3000/users');
                return [3 /*break*/, 5];
            case 4:
                err_4 = _a.sent();
                fastify.log.error(err_4);
                process.exit(1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
start();
