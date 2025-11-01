import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminTables = () => {
  const navigate = useNavigate();

  // Fetch properties
  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch schools
  const { data: schools = [], isLoading: loadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch universities
  const { data: universities = [], isLoading: loadingUniversities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('universities').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch property_vectors
  const { data: propertyVectors = [], isLoading: loadingVectors } = useQuery({
    queryKey: ['property_vectors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('property_vectors').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const renderTable = (data: any[], columns: string[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col} className="whitespace-nowrap">
                    {typeof row[col] === 'object' && row[col] !== null
                      ? JSON.stringify(row[col])
                      : String(row[col] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Database Tables</h1>
              <p className="text-sm text-muted-foreground">
                View all data from Supabase tables
              </p>
            </div>
          </div>
        </Card>

        {/* Tables */}
        <Card className="p-6">
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="properties">
                Properties ({properties.length})
              </TabsTrigger>
              <TabsTrigger value="schools">
                Schools ({schools.length})
              </TabsTrigger>
              <TabsTrigger value="universities">
                Universities ({universities.length})
              </TabsTrigger>
              <TabsTrigger value="vectors">
                Property Vectors ({propertyVectors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Properties Table</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {properties.length} rows
                </p>
              </div>
              {renderTable(
                properties,
                properties.length > 0 ? Object.keys(properties[0]) : [],
                loadingProperties
              )}
            </TabsContent>

            <TabsContent value="schools" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Schools Table</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {schools.length} rows
                </p>
              </div>
              {renderTable(
                schools,
                schools.length > 0 ? Object.keys(schools[0]) : [],
                loadingSchools
              )}
            </TabsContent>

            <TabsContent value="universities" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Universities Table</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {universities.length} rows
                </p>
              </div>
              {renderTable(
                universities,
                universities.length > 0 ? Object.keys(universities[0]) : [],
                loadingUniversities
              )}
            </TabsContent>

            <TabsContent value="vectors" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Property Vectors Table</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {propertyVectors.length} rows
                </p>
              </div>
              {renderTable(
                propertyVectors,
                propertyVectors.length > 0 ? Object.keys(propertyVectors[0]) : [],
                loadingVectors
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminTables;
