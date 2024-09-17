"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slimCard = void 0;
const slimCard = (card) => {
    var _a;
    let slimObj = {
        id: card.id,
        name: card.name
    };
    if (card.image_uris) {
        slimObj.image_uris = {
            normal: (_a = card.image_uris) === null || _a === void 0 ? void 0 : _a.normal
        };
    }
    if (card.card_faces) {
        slimObj.card_faces = card.card_faces.map(c => (0, exports.slimCard)(c));
    }
    return slimObj;
};
exports.slimCard = slimCard;
//# sourceMappingURL=cards.js.map