import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import customersRouter from '@modules/customers/infra/http/routes/customers.routes';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    // TODO
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const foundProducts = await this.ormRepository.findByIds(products);

    return foundProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    // TODO
    const producstsIds = products.map(product => product.id);

    const productsToBeUpdated = await this.ormRepository.findByIds(
      producstsIds,
    );

    productsToBeUpdated.forEach(productToBeUpdated => {
      const productIndex = products.findIndex(
        product => product.id === productToBeUpdated.id,
      );
      // eslint-disable-next-line no-param-reassign
      productToBeUpdated.quantity = products[productIndex].quantity;
    });

    await this.ormRepository.save(productsToBeUpdated);

    return productsToBeUpdated;
  }
}

export default ProductsRepository;
