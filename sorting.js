function getSortingCallback(ordering) {
  if (ordering === 'top') {
    return (a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
  } else if (ordering === 'new') {
    return (a, b) => b.ts - a.ts;
  } else if (ordering === 'old') {
    return (a, b) => a.ts - b.ts;
  } else if (ordering === 'ragebait') {
    return (a, b) => (b.upvotes + Math.abs(b.downvotes)) - (a.upvotes + Math.abs(a.downvotes));
  } else {
    return (a, b) => (a.ts - b.ts);
  }
}

module.exports = {
  getSortingCallback
}