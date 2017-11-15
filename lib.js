'use strict';
let parents = [];
let notFriends = []; // contains dups

const findFriendByName = (name, friends) => friends.find(friend => friend.name === name);

const getIdx = name => {
    for (let i = 0; i < parents.length; i++) {
        if (parents[i].name === name) {
            return i;
        }
    }
};

// const clearParents = () => {
//     const parentsCopy = parents.slice();
//     parentsCopy.forEach(friend => {
//         if (friend.parent === null && !friend.best) {
//             parents.splice(getIdx(friend.name), 1);
//         }
//     });
// };

const getParent = friend => {
    if (friend && parents[getIdx(friend.name)]) {
        return parents[getIdx(friend.name)].parent;
    }

    return null;
};

const countParents = friend => {
    let counter = 1;
    while (getParent(friend) !== null) {
        counter++;
        friend = findFriendByName(getParent(friend).name, parents);
    }

    return counter;
};

const getLevel = friend => countParents(friend);

const sortByLevels = friends => {
    const friendsCopy = [...friends];
    friendsCopy.sort((a, b) => {
        if (getLevel(a) === getLevel(b)) {
            return a.name.localeCompare(b.name);
        }
        if (getLevel(a) === 1) {
            return -1;
        }
        if (getLevel(b) === 1) {
            return 1;
        }

        return getLevel(a) - getLevel(b);
    });

    return friendsCopy;
};

const createNotWelcomeFriends = () => {
    parents.forEach(friend => {
        if (friend.parent === null && !friend.best) {
            notFriends.push(friend.name);
        }
    });
};

const createParents = friends => {
    friends.forEach(element => {
        if (getIdx(element.name) === undefined) {
            parents.push({ name: element.name, parent: null,
                gender: element.gender, best: element.best });
        }
    });
    const besties = friends.filter(element => element.best);
    let queue = besties.slice();
    let visited = besties.slice();
    let currentFriend;

    while (queue.length > 0) {
        const current = queue.shift();
        processChildren(current);
    }
    // clearParents();
    // sortByLevels(parents);

    function processChildren(current) {
        current.friends.forEach(element => {
            currentFriend = findFriendByName(element, friends);
            if (!visited.includes(currentFriend)) {
                parents.forEach(child => {
                    if (child.name === element) {
                        child.parent = current;
                    }
                });
                queue.push(currentFriend);
                visited.push(currentFriend);
            }
        });
    }
    createNotWelcomeFriends();
};

function Iterator(friends, filter) {
    if (!(filter instanceof Filter)) {
        throw new TypeError('Not instance of filter');
    }
    createParents(friends);
    // this.stack = parents
    // .filter(friend => !(friend.parent === null && !friend.best))
    // .map(friend => friends.find(f => f.name === friend.name));
    this.stack = sortByLevels(filter.smallFilter(friends)
        .filter(friend => !notFriends.includes(friend.name)));
}

function LimitedIterator(friends, filter, maxLevel) {
    if (!(filter instanceof Filter)) {
        throw new TypeError('Not instance of filter');
    }
    this.stack = [];
    if (maxLevel > 0) {
        createParents(friends);
        this.stack = friends
            // .filter(friend => !(friend.parent === null && !friend.best))
            // .map(friend => friends.find(f => f.name === friend.name))
            .filter(element => getLevel(element) <= maxLevel)
            .filter(friend => !notFriends.includes(friend.name));
        this.stack = sortByLevels(filter.smallFilter(this.stack));
    }
}

function Filter() {
    this.smallFilter = friends => friends;
}

function MaleFilter() {
    this.smallFilter = friends => this.bigFilter(friends, 'gender', 'male');
}

function FemaleFilter() {
    this.smallFilter = friends => this.bigFilter(friends, 'gender', 'female');
}

Object.setPrototypeOf(FemaleFilter.prototype, Filter.prototype);
Object.setPrototypeOf(MaleFilter.prototype, Filter.prototype);
Object.setPrototypeOf(LimitedIterator.prototype, Iterator.prototype);

Object.assign(Filter.prototype, {
    bigFilter(friends, param, value) {
        return friends.filter(friend => friend[param] === value);
    }
});

Object.assign(Iterator.prototype, {
    done() {
        return this.stack.length === 0;
    },
    next() {
        if (this.stack.length > 0) {
            return this.stack.shift();
        }

        return null;
    }
});

exports.Iterator = Iterator;
exports.LimitedIterator = LimitedIterator;

exports.Filter = Filter;
exports.MaleFilter = MaleFilter;
exports.FemaleFilter = FemaleFilter;
