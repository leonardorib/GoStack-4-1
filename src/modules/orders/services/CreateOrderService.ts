import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found', 400);
    }

    const productsIds = products.map(product => {
      return { id: product.id };
    });

    const foundProducts = await this.productsRepository.findAllById(
      productsIds,
    );

    if (foundProducts.length !== products.length) {
      throw new AppError('At least one of the products was not found', 400);
    }

    // Checks if there is products with insuficient quantity in stock
    const productsWithInsuficientQuantity = foundProducts.filter(
      foundProduct => {
        const orderedQuantity = products.filter(
          requestProduct => requestProduct.id === foundProduct.id,
        )[0].quantity;

        return orderedQuantity > foundProduct.quantity;
      },
    );

    if (productsWithInsuficientQuantity.length > 0) {
      throw new AppError(
        'Requested quantity not available for at least one product',
        400,
      );
    }

    // Generating products array in the required format
    const formattedProducts = foundProducts.map(product => {
      return {
        product_id: product.id,
        price: product.price,
        quantity: products.filter(
          requestProduct => requestProduct.id === product.id,
        )[0].quantity,
      };
    });

    // Generates array with id's of the ordered products and corresponding updated quantities
    const productsToUpdateQuantity = foundProducts.map(
      productToUpdateQuantity => {
        const orderedQuantity = products.filter(
          requestProduct => requestProduct.id === productToUpdateQuantity.id,
        )[0].quantity;

        return {
          id: productToUpdateQuantity.id,
          quantity: productToUpdateQuantity.quantity - orderedQuantity,
        };
      },
    );

    const order = await this.ordersRepository.create({
      customer,
      products: formattedProducts,
    });

    await this.productsRepository.updateQuantity(productsToUpdateQuantity);

    return order;
  }
}

export default CreateOrderService;
