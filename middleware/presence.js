const activeUsers = new Map();

function markPresence(req, res) {
    if (req.user?.uid) {
        activeUsers.set(req.user.uid, Date.now());
    }
    res.json({ success: true });
}

function getActiveUserCount() {
    const cutoff = Date.now() - 2 * 60 * 1000;
    for (const [uid, lastSeen] of activeUsers) {
        if (lastSeen < cutoff) activeUsers.delete(uid);
    }
    return activeUsers.size;
}

module.exports = { markPresence, getActiveUserCount };
