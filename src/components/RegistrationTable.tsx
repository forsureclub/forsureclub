
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Registration } from "@/types/registration";
import { StatusSelect } from "./StatusSelect";
import { RegistrationNotes } from "./RegistrationNotes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Shield } from "lucide-react";

interface RegistrationTableProps {
  registrations: Registration[];
  onUpdateRegistration: (id: string, updates: Partial<Registration>) => void;
  groupBy: 'none' | 'location' | 'sport' | 'skill';
  setGroupBy: (value: 'none' | 'location' | 'sport' | 'skill') => void;
  renderPlayerName?: (player: Registration["player"], playerId: string) => React.ReactNode;
}

export const RegistrationTable = ({
  registrations,
  onUpdateRegistration,
  groupBy,
  setGroupBy,
  renderPlayerName
}: RegistrationTableProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Function to display contact information correctly
  const formatContactInfo = (email: string | null | undefined, phone: string | null | undefined) => {
    const defaultEmail = "no-email@provided.com";
    const defaultPhone = "no-number-provided";
    
    const formattedEmail = !email || email === "null" || email === defaultEmail ? 
      <span className="text-gray-400 italic">No email provided</span> : 
      <span>{email}</span>;
    
    const formattedPhone = !phone || phone === "null" || phone === defaultPhone ? 
      <span className="text-gray-400 italic">No phone provided</span> : 
      <span>{phone}</span>;

    return (
      <>
        {formattedEmail}
        {(email && email !== "null" && email !== defaultEmail) && (phone && phone !== "null" && phone !== defaultPhone) && <br />}
        {formattedPhone}
      </>
    );
  };

  // Function to group registrations
  const groupRegistrations = () => {
    if (groupBy === 'none') {
      return { 'All Players': registrations };
    }

    return registrations.reduce((acc: Record<string, Registration[]>, registration) => {
      let key = '';
      
      if (groupBy === 'location') {
        key = registration.player.city || 'No Location';
      } else if (groupBy === 'sport') {
        key = registration.player.sport || 'No Sport';
      } else if (groupBy === 'skill') {
        const rating = registration.player.rating || 0;
        if (rating === 0) key = 'Not Rated';
        else if (rating < 2) key = 'Beginner (1-1.9)';
        else if (rating < 3) key = 'Novice (2-2.9)';
        else if (rating < 4) key = 'Intermediate (3-3.9)';
        else if (rating < 5) key = 'Advanced (4-4.9)';
        else key = 'Expert (5)';
      }
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(registration);
      return acc;
    }, {});
  };

  const groupedRegistrations = groupRegistrations();
  
  // Sort group keys for consistent display
  const sortedGroups = Object.keys(groupedRegistrations).sort((a, b) => {
    if (a === 'All Players') return -1;
    if (b === 'All Players') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <div className="flex items-center">
          <Shield className="text-orange-500 mr-2" size={20} />
          <span className="text-sm font-medium text-orange-600">Admin-only data - Contains sensitive player information</span>
        </div>
        <div className="w-64">
          <Select
            value={groupBy}
            onValueChange={(value: 'none' | 'location' | 'sport' | 'skill') => setGroupBy(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="location">Group by Location</SelectItem>
              <SelectItem value="sport">Group by Sport</SelectItem>
              <SelectItem value="skill">Group by Skill Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedGroups.map((groupKey) => {
        const groupRegistrations = groupedRegistrations[groupKey];
        const isExpanded = expandedGroups[groupKey] !== false; // Default to expanded
        
        return (
          <div key={groupKey} className="border rounded-md mb-6">
            <div 
              className="bg-slate-100 p-3 font-medium flex justify-between items-center cursor-pointer"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center gap-2">
                <span>{groupKey}</span>
                <Badge variant="outline">{groupRegistrations.length}</Badge>
              </div>
              <span>{isExpanded ? '▼' : '►'}</span>
            </div>
            
            {isExpanded && (
              <div className="p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Player</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Skill Level</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell className="font-medium">
                          {renderPlayerName 
                            ? renderPlayerName(registration.player, registration.player_id)
                            : registration.player.name}
                        </TableCell>
                        <TableCell>{registration.player.sport}</TableCell>
                        <TableCell>{registration.player.city}</TableCell>
                        <TableCell>{registration.player.industry}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatContactInfo(registration.player.email, registration.player.phone_number)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {registration.player.rating ? (
                            `${registration.player.rating.toFixed(1)}/5.0`
                          ) : (
                            "Not rated"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(registration.created_at)}</TableCell>
                        <TableCell>
                          <StatusSelect
                            status={registration.status}
                            onChange={(value) => 
                              onUpdateRegistration(registration.id, { status: value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <RegistrationNotes
                            notes={registration.admin_notes}
                            onUpdate={(notes) => 
                              onUpdateRegistration(registration.id, { admin_notes: notes })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
