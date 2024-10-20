import { newSpecPage } from '@stencil/core/testing';
import { ComponentGamePokerSquares } from '../component-game-poker-squares';

describe('component-game-poker-squares', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ComponentGamePokerSquares],
      html: `<component-game-poker-squares></component-game-poker-squares>`,
    });
    expect(page.root).toEqualHtml(`
      <component-game-poker-squares>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </component-game-poker-squares>
    `);
  });
});
