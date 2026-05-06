import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button, Input, Select, Drawer } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Wrench } from "@medusajs/icons"

type RepairTicket = {
  id: string
  ticket_number: string
  status: string
  technician_name?: string
  issue_description: string
  total_estimate: number
  created_at: string
  estimated_completion?: string
}

const RepairsPage = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    issue_description: "",
    technician_name: "",
    total_estimate: "",
  })

  const loadTickets = () => {
    setLoading(true)
    fetch(`/admin/repairs`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.repair_tickets || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load repair tickets:", err)
        setLoading(false)
      })
  }

  const handleCreateTicket = async () => {
    try {
      const response = await fetch("/admin/repairs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          issue_description: newTicket.issue_description,
          technician_name: newTicket.technician_name || undefined,
          total_estimate: parseFloat(newTicket.total_estimate) * 100,
        }),
      })

      if (response.ok) {
        setIsDrawerOpen(false)
        setNewTicket({
          issue_description: "",
          technician_name: "",
          total_estimate: "",
        })
        loadTickets()
      } else {
        console.error("Failed to create repair ticket")
      }
    } catch (error) {
      console.error("Error creating repair ticket:", error)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      received: "grey",
      diagnosing: "blue",
      awaiting_approval: "orange",
      repairing: "blue",
      ready: "green",
      completed: "green",
      cancelled: "red",
    }
    return colors[status] || "grey"
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.technician_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Repair Tickets</Heading>
        <Button onClick={() => setIsDrawerOpen(true)}>Create Repair Ticket</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by ticket #, issue, or technician..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Statuses</Select.Item>
            <Select.Item value="received">Received</Select.Item>
            <Select.Item value="diagnosing">Diagnosing</Select.Item>
            <Select.Item value="awaiting_approval">Awaiting Approval</Select.Item>
            <Select.Item value="repairing">Repairing</Select.Item>
            <Select.Item value="ready">Ready</Select.Item>
            <Select.Item value="completed">Completed</Select.Item>
            <Select.Item value="cancelled">Cancelled</Select.Item>
          </Select.Content>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading repair tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p>No repair tickets found</p>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Ticket #</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Technician</Table.HeaderCell>
              <Table.HeaderCell>Issue</Table.HeaderCell>
              <Table.HeaderCell>Estimate</Table.HeaderCell>
              <Table.HeaderCell>ETC</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredTickets.map((ticket) => (
              <Table.Row key={ticket.id}>
                <Table.Cell>{ticket.ticket_number}</Table.Cell>
                <Table.Cell>
                  <Badge color={getStatusColor(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {ticket.technician_name ? (
                    <span>{ticket.technician_name}</span>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </Table.Cell>
                <Table.Cell>{ticket.issue_description}</Table.Cell>
                <Table.Cell>${(ticket.total_estimate / 100).toFixed(2)}</Table.Cell>
                <Table.Cell>
                  {ticket.estimated_completion
                    ? new Date(ticket.estimated_completion).toLocaleDateString()
                    : "-"}
                </Table.Cell>
                <Table.Cell>{new Date(ticket.created_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <a href={`/app/repairs/${ticket.id}`}>View</a>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Create Repair Ticket</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Description *</label>
              <Input
                placeholder="Describe the issue..."
                value={newTicket.issue_description}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, issue_description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Technician Name</label>
              <Input
                placeholder="Assign technician (optional)"
                value={newTicket.technician_name}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, technician_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimate (in dollars) *</label>
              <Input
                type="number"
                placeholder="0.00"
                value={newTicket.total_estimate}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, total_estimate: e.target.value })
                }
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newTicket.issue_description || !newTicket.total_estimate}
            >
              Create Ticket
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Repairs",
  icon: Wrench,
})

export default RepairsPage