import dbConnect from '../../../lib/db/mongoose';
import Order from '../../../lib/db/models/Order';
import type { NextApiRequest, NextApiResponse } from 'next';

// Função auxiliar para ajustar data para UTC-3 (Juiz de Fora)
const adjustDateToMG = (dateString: string | Date) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    date.setHours(date.getHours() - 3);
    return date;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        // Busca todos os pedidos ordenados por data (mais recentes primeiro)
        const orders = await Order.find({}).sort({ orderDate: -1 });
        res.status(200).json({ success: true, data: orders });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case 'POST':
      try {
        // Cria um novo pedido
        // Garante que o ID não seja enviado manualmente
        const { _id, ...newOrderData } = req.body;
        
        // Ajusta data de entrada se necessário (opcional, pois o front já manda)
        // Mas garante que a data de criação no banco seja precisa
        if (!newOrderData.orderDate) {
            newOrderData.orderDate = adjustDateToMG(new Date());
        }

        const order = await Order.create(newOrderData);
        res.status(201).json({ success: true, data: order });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        // Atualiza um pedido existente
        const { _id, ...updateData } = req.body;

        if (!_id) {
            return res.status(400).json({ success: false, error: "ID é obrigatório para edição" });
        }

        const order = await Order.findByIdAndUpdate(_id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!order) {
            return res.status(404).json({ success: false, error: "Pedido não encontrado" });
        }
        res.status(200).json({ success: true, data: order });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, error: "ID obrigatório" });

        const deletedOrder = await Order.deleteOne({ _id: id });
        if (!deletedOrder.deletedCount) {
          return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(405).json({ success: false, error: "Método não permitido" });
      break;
  }
}