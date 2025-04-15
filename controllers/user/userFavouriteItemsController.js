const Favourite = require('../../models/FavouriteItems');

exports.addFavouriteItem = async (req, res) => {
  const { itemId } = req.body;
  const {userId, canteenId} = req.params;

  try {
    let favDoc = await Favourite.findOne({ userId });

    // If no favourite document exists for user, create one
    if (!favDoc) {
      favDoc = new Favourite({
        userId,
        canteens: [{
          canteenId,
          favouriteItems: [{ itemId }],
        }],
      });
    } else {
      // Find the canteen
      let canteen = favDoc.canteens.find(c => c.canteenId.toString() === canteenId);

      if (!canteen) {
        // Add new canteen with the item
        favDoc.canteens.push({
          canteenId,
          favouriteItems: [{ itemId }],
        });
      } else {
        // Check if item already exists
        const itemExists = canteen.favouriteItems.some(i => i.itemId.toString() === itemId);
        if (!itemExists) {
          canteen.favouriteItems.push({ itemId });
        }
      }
    }

    await favDoc.save();
    res.status(200).json({ message: 'Item added to favourites', data: favDoc });

  } catch (err) {
    res.status(500).json({ message: 'Error adding favourite item', error: err.message });
  }
};



exports.removeFavouriteItem = async (req, res) => {
    const { userId, canteenId, itemId } = req.params;
   
    try {
      const favDoc = await Favourite.findOne({ userId });
      if (!favDoc) {
        return res.status(404).json({ message: 'Favourites not found' });
      }
  
      // Find the target canteen subdoc
      const canteen = favDoc.canteens.find(
        c => c.canteenId.toString() === canteenId
      );
  
      if (!canteen) {
        return res.status(404).json({ message: 'Canteen not found in favourites' });
      }
  
      // Find the index of the item in the favouriteItems array
      const itemIndex = canteen.favouriteItems.findIndex(
        i => i.itemId.toString() === itemId
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in favourites' });
      }
  
      // Remove the item using splice
      canteen.favouriteItems.splice(itemIndex, 1);
  
      // If canteen has no more items, remove the canteen itself
      if (canteen.favouriteItems.length === 0) {
        favDoc.canteens = favDoc.canteens.filter(
          c => c.canteenId.toString() !== canteenId
        );
      }
  
      await favDoc.save();
  
      res.status(200).json({ message: 'Item removed from favourites', data: favDoc });
    } catch (err) {
      res.status(500).json({ message: 'Error removing favourite item', error: err.message });
    }
  };
  
  

  
  exports.getFavouriteItems = async (req, res) => {
    const { userId } = req.params;
    const { canteenId } = req.query;
  
    try {
      const favDoc = await Favourite.findOne({ userId });
      if (!favDoc) return res.status(404).json({ message: 'No favourites found' });
  
      let canteens = favDoc.canteens;
  
      // Filter by canteen if provided
      if (canteenId) {
        canteens = canteens.filter(c => c.canteenId.toString() === canteenId);
      }
  
      res.status(200).json({ message: 'Favourites fetched', data: canteens });
  
    } catch (err) {
      res.status(500).json({ message: 'Error fetching favourites', error: err.message });
    }
  };
  