import { newE2EPage } from '@stencil/core/testing';

describe('component-game-poker-squares', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<component-game-poker-squares></component-game-poker-squares>');
    const element = await page.find('component-game-poker-squares');
    expect(element).toHaveClass('hydrated');
  });
});
