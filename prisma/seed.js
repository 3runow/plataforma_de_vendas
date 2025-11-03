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
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var products, _i, products_1, product;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Limpar produtos existentes
                return [4 /*yield*/, prisma.product.deleteMany()];
                case 1:
                    // Limpar produtos existentes
                    _a.sent();
                    products = [
                        {
                            name: "BRICKS ANGEL",
                            description: "Figura de blocos de montar estilo Angel",
                            price: 49.90,
                            stock: 20,
                            imageUrl: "/assets/image/2025-09-BRICKS-ANGEL.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS BOB",
                            description: "Figura de blocos de montar estilo Bob Esponja",
                            price: 49.90,
                            stock: 15,
                            imageUrl: "/assets/image/2025-09-BRICKS-BOB.jpg",
                            isNew: true,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS BURRO",
                            description: "Figura de blocos de montar estilo Burro do Shrek",
                            price: 49.90,
                            stock: 18,
                            imageUrl: "/assets/image/2025-09-BRICKS-BURRO.jpg",
                            isNew: false,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS HELLO KITTY",
                            description: "Figura de blocos de montar estilo Hello Kitty",
                            price: 49.90,
                            stock: 25,
                            imageUrl: "/assets/image/2025-09-BRICKS-HELLO_KITTY.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS LEITÃO",
                            description: "Figura de blocos de montar estilo Leitão",
                            price: 49.90,
                            stock: 12,
                            imageUrl: "/assets/image/2025-09-BRICKS-LEITAO.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS LUIGI",
                            description: "Figura de blocos de montar estilo Luigi",
                            price: 49.90,
                            stock: 22,
                            imageUrl: "/assets/image/2025-09-BRICKS-LUIGI.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS LULA MOLUSCO",
                            description: "Figura de blocos de montar estilo Lula Molusco",
                            price: 49.90,
                            stock: 16,
                            imageUrl: "/assets/image/2025-09-BRICKS-LULA_MOLUSCO.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS MARCIANO",
                            description: "Figura de blocos de montar estilo Marciano",
                            price: 49.90,
                            stock: 14,
                            imageUrl: "/assets/image/2025-09-BRICKS-MARCIANO.jpg",
                            isNew: true,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS MARGARIDA",
                            description: "Figura de blocos de montar estilo Margarida",
                            price: 49.90,
                            stock: 19,
                            imageUrl: "/assets/image/2025-09-BRICKS-MARGARIDA.jpg",
                            isNew: false,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS MARIO",
                            description: "Figura de blocos de montar estilo Mario",
                            price: 49.90,
                            stock: 30,
                            imageUrl: "/assets/image/2025-09-BRICKS-MARIO.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS MICKEY",
                            description: "Figura de blocos de montar estilo Mickey",
                            price: 49.90,
                            stock: 28,
                            imageUrl: "/assets/image/2025-09-BRICKS-MICKEY.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS MINNIE ROSA",
                            description: "Figura de blocos de montar estilo Minnie Rosa",
                            price: 49.90,
                            stock: 24,
                            imageUrl: "/assets/image/2025-09-BRICKS-MINNIE_ROSA.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS PATETA",
                            description: "Figura de blocos de montar estilo Pateta",
                            price: 49.90,
                            stock: 17,
                            imageUrl: "/assets/image/2025-09-BRICKS-PATETA.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS PATO DONALD",
                            description: "Figura de blocos de montar estilo Pato Donald",
                            price: 49.90,
                            stock: 21,
                            imageUrl: "/assets/image/2025-09-BRICKS-PATO_DONALD.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS PATRICK",
                            description: "Figura de blocos de montar estilo Patrick",
                            price: 49.90,
                            stock: 23,
                            imageUrl: "/assets/image/2025-09-BRICKS-PATRICK.jpg",
                            isNew: false,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS PIKACHU",
                            description: "Figura de blocos de montar estilo Pikachu",
                            price: 49.90,
                            stock: 35,
                            imageUrl: "/assets/image/2025-09-BRICKS-PIKACHU.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS PLUTO",
                            description: "Figura de blocos de montar estilo Pluto",
                            price: 49.90,
                            stock: 18,
                            imageUrl: "/assets/image/2025-09-BRICKS-PLUTO.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS POOH",
                            description: "Figura de blocos de montar estilo Pooh",
                            price: 49.90,
                            stock: 26,
                            imageUrl: "/assets/image/2025-09-BRICKS-POOH.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS PSYDUCK",
                            description: "Figura de blocos de montar estilo Psyduck",
                            price: 49.90,
                            stock: 15,
                            imageUrl: "/assets/image/2025-09-BRICKS-PSYDUCK.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS PUMBA",
                            description: "Figura de blocos de montar estilo Pumba",
                            price: 49.90,
                            stock: 13,
                            imageUrl: "/assets/image/2025-09-BRICKS-PUMBA.jpg",
                            isNew: true,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS SIMBA",
                            description: "Figura de blocos de montar estilo Simba",
                            price: 49.90,
                            stock: 20,
                            imageUrl: "/assets/image/2025-09-BRICKS-SIMBA.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS SIRIGUEIJO",
                            description: "Figura de blocos de montar estilo Sirigueijo",
                            price: 49.90,
                            stock: 14,
                            imageUrl: "/assets/image/2025-09-BRICKS-SIRIGUEIJO.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                        {
                            name: "BRICKS STITCH",
                            description: "Figura de blocos de montar estilo Stitch",
                            price: 49.90,
                            stock: 32,
                            imageUrl: "/assets/image/2025-09-BRICKS-STITCH.jpg",
                            isNew: true,
                            isFeatured: true,
                        },
                        {
                            name: "BRICKS TIGRAO",
                            description: "Figura de blocos de montar estilo Tigrão",
                            price: 49.90,
                            stock: 16,
                            imageUrl: "/assets/image/2025-09-BRICKS-TIGRAO.jpg",
                            isNew: false,
                            isFeatured: false,
                        },
                    ];
                    _i = 0, products_1 = products;
                    _a.label = 2;
                case 2:
                    if (!(_i < products_1.length)) return [3 /*break*/, 5];
                    product = products_1[_i];
                    return [4 /*yield*/, prisma.product.create({
                            data: product,
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\u2705 ".concat(products.length, " produtos criados com sucesso!"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
