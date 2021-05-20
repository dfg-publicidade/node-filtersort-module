"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSUtilTypeOrm = exports.FSUtilMongoDb = void 0;
const fsUtilMongoDb_1 = __importDefault(require("./fsUtil/fsUtilMongoDb"));
exports.FSUtilMongoDb = fsUtilMongoDb_1.default;
const fsUtilTypeOrm_1 = __importDefault(require("./fsUtil/fsUtilTypeOrm"));
exports.FSUtilTypeOrm = fsUtilTypeOrm_1.default;
