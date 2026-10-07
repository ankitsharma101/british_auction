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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
// RFQ Creation Endpoint
app.post('/api/rfq', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, bidStartAt, bidCloseAt, forcedCloseAt, pickupDate, triggerWindowMinutes, extensionDurationMinutes, triggerType, } = req.body;
        if (new Date(forcedCloseAt) <= new Date(bidCloseAt)) {
            return res.status(400).json({ error: 'Forced Close Time must be strictly later than Bid Close Time' });
        }
        if (triggerWindowMinutes <= 0 || extensionDurationMinutes <= 0) {
            return res.status(400).json({ error: 'Configuration minutes must be greater than 0' });
        }
        const rfq = yield prisma.rFQ.create({
            data: {
                name,
                bidStartAt: new Date(bidStartAt),
                bidCloseAt: new Date(bidCloseAt),
                forcedCloseAt: new Date(forcedCloseAt),
                pickupDate: new Date(pickupDate),
                triggerWindowMinutes,
                extensionDurationMinutes,
                triggerType,
            },
        });
        res.status(201).json(rfq);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create RFQ' });
    }
}));
// Listing Endpoint
app.get('/api/rfq', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rfqs = yield prisma.rFQ.findMany({
            include: {
                bids: {
                    orderBy: { totalAmount: 'asc' },
                    take: 1, // Get L1 for current lowest bid
                },
            },
        });
        const now = new Date();
        const formattedRfqs = rfqs.map((rfq) => {
            var _a;
            let status = 'ACTIVE';
            if ((0, date_fns_1.isAfter)(now, rfq.forcedCloseAt)) {
                status = 'FORCE_CLOSED';
            }
            else if ((0, date_fns_1.isAfter)(now, rfq.bidCloseAt)) {
                status = 'CLOSED';
            }
            else if ((0, date_fns_1.isBefore)(now, rfq.bidStartAt)) {
                status = 'UPCOMING';
            }
            return Object.assign(Object.assign({}, rfq), { currentLowestBid: ((_a = rfq.bids[0]) === null || _a === void 0 ? void 0 : _a.totalAmount) || null, status });
        });
        res.json(formattedRfqs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch RFQs' });
    }
}));
// Details Endpoint
app.get('/api/rfq/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const rfq = yield prisma.rFQ.findUnique({
            where: { id },
            include: {
                bids: {
                    orderBy: { totalAmount: 'asc' },
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }
        const now = new Date();
        let status = 'ACTIVE';
        if ((0, date_fns_1.isAfter)(now, rfq.forcedCloseAt)) {
            status = 'FORCE_CLOSED';
        }
        else if ((0, date_fns_1.isAfter)(now, rfq.bidCloseAt)) {
            status = 'CLOSED';
        }
        else if ((0, date_fns_1.isBefore)(now, rfq.bidStartAt)) {
            status = 'UPCOMING';
        }
        // Assign Rankings
        const rankedBids = rfq.bids.map((bid, index) => (Object.assign(Object.assign({}, bid), { rank: `L${index + 1}` })));
        res.json(Object.assign(Object.assign({}, rfq), { bids: rankedBids, status }));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch RFQ details' });
    }
}));
// Bid Submission Endpoint
app.post('/api/rfq/:id/bids', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { supplierName, freightCharges, originCharges, destinationCharges, transitTime, validityDate, } = req.body;
        if (freightCharges < 0 || originCharges < 0 || destinationCharges < 0) {
            return res.status(400).json({ error: 'Charges cannot be negative' });
        }
        const rfq = yield prisma.rFQ.findUnique({
            where: { id },
            include: { bids: { orderBy: { totalAmount: 'asc' } } },
        });
        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }
        const now = new Date();
        if ((0, date_fns_1.isAfter)(now, rfq.bidCloseAt) || (0, date_fns_1.isAfter)(now, rfq.forcedCloseAt)) {
            return res.status(400).json({ error: 'Auction is closed' });
        }
        const totalAmount = freightCharges + originCharges + destinationCharges;
        // Snapshot of current ranks
        const oldBids = [...rfq.bids];
        // Log Bid Submission
        yield prisma.activityLog.create({
            data: {
                rfqId: id,
                activityType: 'BID_SUBMISSION',
                description: `Supplier ${supplierName} submitted a bid of ${totalAmount}`,
            },
        });
        const newBid = yield prisma.bid.create({
            data: {
                rfqId: id,
                supplierName,
                freightCharges,
                originCharges,
                destinationCharges,
                totalAmount,
                transitTime,
                validityDate: new Date(validityDate),
            },
        });
        // Re-fetch bids to see new ranks
        const newBids = yield prisma.bid.findMany({
            where: { rfqId: id },
            orderBy: { totalAmount: 'asc' },
        });
        // Extension Logic
        const minutesToClose = (0, date_fns_1.differenceInMinutes)(rfq.bidCloseAt, now);
        let extendAuction = false;
        let extensionReason = '';
        if (minutesToClose <= rfq.triggerWindowMinutes) {
            if (rfq.triggerType === 'ANY_BID') {
                extendAuction = true;
                extensionReason = 'Bid received within trigger window';
            }
            else if (rfq.triggerType === 'ANY_RANK_CHANGE') {
                // Did ranks change?
                const isChange = newBids.some((b, i) => oldBids[i] && b.id !== oldBids[i].id);
                if (isChange || newBids.length !== oldBids.length) {
                    extendAuction = true;
                    extensionReason = 'Rank changed within trigger window';
                }
            }
            else if (rfq.triggerType === 'L1_RANK_CHANGE') {
                const oldL1 = oldBids[0];
                const newL1 = newBids[0];
                if (!oldL1 || newL1.id !== oldL1.id) {
                    extendAuction = true;
                    extensionReason = 'L1 bidder changed within trigger window';
                }
            }
        }
        if (extendAuction) {
            let proposedCloseAt = (0, date_fns_1.addMinutes)(rfq.bidCloseAt, rfq.extensionDurationMinutes);
            let actualCloseAt = proposedCloseAt;
            if ((0, date_fns_1.isAfter)(proposedCloseAt, rfq.forcedCloseAt)) {
                actualCloseAt = rfq.forcedCloseAt;
                extensionReason += ' (Capped at Forced Close Time)';
            }
            // Check if we are really extending
            if ((0, date_fns_1.isAfter)(actualCloseAt, rfq.bidCloseAt)) {
                yield prisma.rFQ.update({
                    where: { id },
                    data: { bidCloseAt: actualCloseAt },
                });
                yield prisma.activityLog.create({
                    data: {
                        rfqId: id,
                        activityType: 'TIME_EXTENSION',
                        description: `Auction extended to ${actualCloseAt.toISOString()}. Reason: ${extensionReason}`,
                    },
                });
            }
        }
        res.status(201).json(newBid);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit bid' });
    }
}));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
