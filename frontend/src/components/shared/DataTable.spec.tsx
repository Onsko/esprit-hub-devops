import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DataTable from './DataTable';

describe('DataTable Component', () => {
  interface TestItem {
    id: string;
    name: string;
  }

  const defaultColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
  ];

  const defaultData: TestItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];

  it('should render without crashing', () => {
    const { container } = render(
      <DataTable columns={defaultColumns} data={defaultData} />
    );
    expect(container).toBeDefined();
  });

  it('should render table element', () => {
    const { container } = render(
      <DataTable columns={defaultColumns} data={defaultData} />
    );
    const table = container.querySelector('table');
    expect(table).toBeDefined();
  });

  it('should display column headers', () => {
    const { container } = render(
      <DataTable columns={defaultColumns} data={defaultData} />
    );
    expect(container.innerHTML).toContain('ID');
    expect(container.innerHTML).toContain('Name');
  });

  it('should display data rows', () => {
    const { container } = render(
      <DataTable columns={defaultColumns} data={defaultData} />
    );
    expect(container.innerHTML).toContain('Item 1');
    expect(container.innerHTML).toContain('Item 2');
  });

  it('should handle empty data', () => {
    const { container } = render(
      <DataTable columns={defaultColumns} data={[]} />
    );
    expect(container).toBeDefined();
    expect(container.innerHTML).toContain('Aucune donnee');
  });

  it('should display custom empty message', () => {
    const { container } = render(
      <DataTable
        columns={defaultColumns}
        data={[]}
        emptyMessage="No items found"
      />
    );
    expect(container.innerHTML).toContain('No items found');
  });

  it('should handle row click callback', () => {
    const handleRowClick = () => {};
    const { container } = render(
      <DataTable
        columns={defaultColumns}
        data={defaultData}
        onRowClick={handleRowClick}
      />
    );
    expect(container).toBeDefined();
  });

  it('should render custom column content', () => {
    const customColumns = [
      { key: 'id', header: 'ID' },
      {
        key: 'name',
        header: 'Name',
        render: (item: TestItem) => `Custom: ${item.name}`,
      },
    ];
    const { container } = render(
      <DataTable columns={customColumns} data={defaultData} />
    );
    expect(container.innerHTML).toContain('Custom:');
  });
});
