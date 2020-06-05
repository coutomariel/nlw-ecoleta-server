import { Request, Response } from 'express'
import knex from '../database/connection';

class PointsController {

    async index(req: Request, res: Response) {
        const { uf, city, items} = req.query;

        const parsedItems = String(items)
            .split(',')
            .map( item => Number(item.trim()));

        console.log(parsedItems);
        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('uf',String(uf))
            .where('city',String(city))
            .distinct()
            .select('points.*');

        return res.json(points);
    }
    
    async show(req: Request, res: Response) {
        const { id } = req.params;
        const point = await knex('points').where('id', id).first();

        if(!point){
            return res.status(400).json({ message:"Point not found"});
        };

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', '=', id)
            .select('title');

        return res.json({ point, items});
    }
    
    async create(req: Request, res: Response) {
        const { name, email, whatsapp, latitude,
            longitude, city, uf, items } = req.body;

        const trx = await knex.transaction();

        const insertedIds = await trx('points').insert({
            image: 'https://images.unsplash.com/photo-1533413710577-c1b62c5fc55b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60', 
            name, 
            email, 
            whatsapp, 
            latitude,
            longitude, 
            city, 
            uf
        });

        const point_items = items.map((item_id: number) => {
            return {
                item_id,
                point_id: insertedIds[0]
            };
        });

        await trx('point_items').insert(point_items);

        trx.commit();

        return res.json({ success: true });
    }

}

export default PointsController;